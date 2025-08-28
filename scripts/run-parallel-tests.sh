#!/bin/bash

# Parallel Test Runner for Playwright E2E Tests
# This script runs multiple test suites in parallel Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed.${NC}" >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose v2 is required but not installed.${NC}" >&2; exit 1; }

# Configuration
BASE_PROJECT_NAME="fresco-e2e"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="./test-results-parallel"
COMPOSE_FILE="docker-compose.test.yml"

# Test suites to run in parallel
TEST_SUITES=("auth" "dashboard" "interview")
BROWSERS=("chromium" "firefox" "webkit")

# Port configuration for parallel execution
BASE_APP_PORT=3000
BASE_DB_PORT=5433
PORT_INCREMENT=10

# Parse command line arguments
PARALLEL_MODE="suites" # Default: run suites in parallel
CLEANUP=true
BUILD=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      PARALLEL_MODE="$2"
      shift 2
      ;;
    --no-cleanup)
      CLEANUP=false
      shift
      ;;
    --no-build)
      BUILD=false
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --mode <suites|browsers|all>  Parallel execution mode (default: suites)"
      echo "  --no-cleanup                   Don't cleanup containers after tests"
      echo "  --no-build                     Skip Docker image building"
      echo "  --help                         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${GREEN}🚀 Starting Parallel Playwright Tests${NC}"
echo -e "Mode: ${YELLOW}$PARALLEL_MODE${NC}"
echo -e "Timestamp: ${YELLOW}$TIMESTAMP${NC}"
echo ""

# Build Docker images if requested
if [ "$BUILD" = true ]; then
  echo -e "${YELLOW}📦 Building Docker images...${NC}"
  docker compose -f "$COMPOSE_FILE" build
  echo -e "${GREEN}✅ Docker images built successfully${NC}"
  echo ""
fi

# Function to calculate unique ports for each pod
get_pod_ports() {
  local pod_index=$1
  local app_port=$((BASE_APP_PORT + (pod_index * PORT_INCREMENT)))
  local db_port=$((BASE_DB_PORT + (pod_index * PORT_INCREMENT)))
  echo "$app_port $db_port"
}

# Function to run a single test pod
run_test_pod() {
  local suite=$1
  local browser=$2
  local pod_index=$3
  local project_name="${BASE_PROJECT_NAME}-${suite}-${browser}-${TIMESTAMP}"
  local log_file="${RESULTS_DIR}/${suite}-${browser}.log"
  
  # Get unique ports for this pod
  read app_port db_port <<< $(get_pod_ports $pod_index)
  
  echo -e "${YELLOW}▶️  Starting pod: ${suite} on ${browser} (App: $app_port, DB: $db_port)${NC}"
  
  # Create a temporary directory for this pod's test results
  local pod_results_dir="${RESULTS_DIR}/${suite}-${browser}"
  mkdir -p "$pod_results_dir"
  
  # Run in a subshell to isolate environment variables
  (
    export COMPOSE_PROJECT_NAME="$project_name"
    export APP_PORT="$app_port"
    export POSTGRES_PORT="$db_port"
    
    # Start the entire stack for this pod
    echo "Starting services for pod ${project_name}..." >> "$log_file"
    docker compose -f "$COMPOSE_FILE" up -d postgres nextjs_app >> "$log_file" 2>&1
    
    # Wait for services to be healthy
    echo "Waiting for services to be healthy..." >> "$log_file"
    local retries=0
    local max_retries=60
    while [ $retries -lt $max_retries ]; do
      if docker compose -f "$COMPOSE_FILE" -p "$project_name" ps | grep -q "healthy"; then
        break
      fi
      sleep 2
      retries=$((retries + 1))
    done
    
    if [ $retries -eq $max_retries ]; then
      echo "Services failed to become healthy" >> "$log_file"
      docker compose -f "$COMPOSE_FILE" -p "$project_name" down -v
      exit 1
    fi
    
    echo "Running tests..." >> "$log_file"
    
    # Run the tests
    docker compose -f "$COMPOSE_FILE" run \
      --rm \
      -e BASE_URL="http://nextjs_app:3000" \
      -e CI="true" \
      -e SKIP_WEBSERVER="true" \
      -v "${PWD}/${pod_results_dir}:/tests/test-results" \
      -v "${PWD}/${pod_results_dir}/playwright-report:/tests/playwright-report" \
      playwright_runner \
      pnpm exec playwright test "tests/e2e/${suite}/**/*.spec.ts" \
        --project="$browser" \
        --reporter=html,line \
      >> "$log_file" 2>&1
    
    local test_exit_code=$?
    
    # Cleanup this pod's containers
    echo "Cleaning up pod containers..." >> "$log_file"
    docker compose -f "$COMPOSE_FILE" -p "$project_name" down -v >> "$log_file" 2>&1
    
    exit $test_exit_code
  ) &
  
  echo $! # Return the process ID
}

# Function to run tests based on mode
run_parallel_tests() {
  local pids=()
  local pod_index=0
  
  case $PARALLEL_MODE in
    suites)
      # Run all suites in parallel with default browser
      for suite in "${TEST_SUITES[@]}"; do
        pid=$(run_test_pod "$suite" "chromium" $pod_index)
        pids+=($pid)
        pod_index=$((pod_index + 1))
      done
      ;;
    
    browsers)
      # Run all browsers in parallel for all suites
      for browser in "${BROWSERS[@]}"; do
        for suite in "${TEST_SUITES[@]}"; do
          pid=$(run_test_pod "$suite" "$browser" $pod_index)
          pids+=($pid)
          pod_index=$((pod_index + 1))
        done
      done
      ;;
    
    all)
      # Run everything in parallel (use with caution - resource intensive)
      for suite in "${TEST_SUITES[@]}"; do
        for browser in "${BROWSERS[@]}"; do
          pid=$(run_test_pod "$suite" "$browser" $pod_index)
          pids+=($pid)
          pod_index=$((pod_index + 1))
        done
      done
      ;;
    
    *)
      echo -e "${RED}❌ Invalid mode: $PARALLEL_MODE${NC}"
      exit 1
      ;;
  esac
  
  echo -e "${GREEN}📊 Started ${#pids[@]} test pods${NC}"
  echo ""
  
  # Wait for all test pods to complete
  local failed=0
  for pid in "${pids[@]}"; do
    if wait $pid; then
      echo -e "${GREEN}✅ Pod $pid completed successfully${NC}"
    else
      echo -e "${RED}❌ Pod $pid failed${NC}"
      failed=$((failed + 1))
    fi
  done
  
  return $failed
}

# Function to wait for service health with timeout
wait_for_service() {
  local service=$1
  local max_attempts=30
  local attempt=1
  
  echo -e "${YELLOW}⏳ Waiting for $service to be healthy...${NC}"
  
  while [ $attempt -le $max_attempts ]; do
    if docker compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | grep -q "^$service$"; then
      # Check if the service is actually healthy
      if docker compose -f "$COMPOSE_FILE" exec -T $service echo "Service is ready" 2>/dev/null; then
        echo -e "${GREEN}✅ $service is healthy${NC}"
        return 0
      fi
    fi
    
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo -e "${RED}❌ Timeout waiting for $service to be healthy${NC}"
  return 1
}

# Main execution
main() {
  local start_time=$(date +%s)
  
  # For parallel execution, we'll start services with each pod instead of globally
  # This ensures each pod has its own isolated environment
  
  echo -e "${YELLOW}🚀 Preparing parallel test execution...${NC}"
  echo -e "Each pod will start its own isolated services stack${NC}"
  echo ""
  
  # Run parallel tests
  if run_parallel_tests; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    local exit_code=0
  else
    echo -e "${RED}❌ Some tests failed!${NC}"
    local exit_code=1
  fi
  
  # Calculate execution time
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  echo ""
  echo -e "${GREEN}⏱️  Total execution time: ${duration} seconds${NC}"
  
  # Cleanup if requested
  if [ "$CLEANUP" = true ]; then
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up any remaining containers...${NC}"
    # Clean up any containers that might still be running
    for project in $(docker compose ls -q | grep "^${BASE_PROJECT_NAME}"); do
      docker compose -p "$project" -f "$COMPOSE_FILE" down -v 2>/dev/null
    done
    echo -e "${GREEN}✅ Cleanup completed${NC}"
  fi
  
  # Generate summary report
  echo ""
  echo -e "${YELLOW}📋 Test Results Summary:${NC}"
  echo "================================"
  for log_file in "$RESULTS_DIR"/*.log; do
    if [ -f "$log_file" ]; then
      suite_name=$(basename "$log_file" .log)
      # Check for various failure indicators
      if grep -qE "(failed|FAILED|Error|ERROR|✗)" "$log_file"; then
        echo -e "${RED}❌ $suite_name: FAILED${NC}"
        # Show last few lines of failed test for debugging
        echo "  Last lines from log:"
        tail -n 5 "$log_file" | sed 's/^/    /'
      elif grep -qE "(passed|PASSED|✓|All tests passed)" "$log_file"; then
        echo -e "${GREEN}✅ $suite_name: PASSED${NC}"
      else
        echo -e "${YELLOW}⚠️  $suite_name: UNKNOWN (check log file)${NC}"
      fi
    fi
  done
  echo "================================"
  echo ""
  echo "Log files available in: $RESULTS_DIR"
  echo "Test reports available in: $RESULTS_DIR/*/playwright-report"
  
  exit $exit_code
}

# Run the main function
main