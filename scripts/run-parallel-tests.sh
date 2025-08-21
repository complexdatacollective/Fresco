#!/bin/bash

# Parallel Test Runner for Playwright E2E Tests
# This script runs multiple test suites in parallel Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_PROJECT_NAME="fresco-e2e"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="./test-results-parallel"
COMPOSE_FILE="docker-compose.test.yml"

# Test suites to run in parallel
TEST_SUITES=("auth" "dashboard" "interview")
BROWSERS=("chromium" "firefox" "webkit")

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

# Function to run a single test pod
run_test_pod() {
  local suite=$1
  local browser=$2
  local project_name="${BASE_PROJECT_NAME}-${suite}-${browser}-${TIMESTAMP}"
  local log_file="${RESULTS_DIR}/${suite}-${browser}.log"
  
  echo -e "${YELLOW}▶️  Starting pod: ${suite} on ${browser}${NC}"
  
  # Set environment variables for this pod
  export COMPOSE_PROJECT_NAME="$project_name"
  export TEST_SUITE="$suite"
  export TEST_BROWSER="$browser"
  export PARALLEL_WORKERS=2
  
  # Run the test pod
  docker compose -f "$COMPOSE_FILE" run \
    --rm \
    -e TEST_SUITE="$suite" \
    -e TEST_BROWSER="$browser" \
    -e PARALLEL_WORKERS=2 \
    playwright_runner \
    pnpm exec playwright test \
      --config=playwright.config.parallel.ts \
      --project="${suite}-${browser}" \
    > "$log_file" 2>&1 &
  
  echo $! # Return the process ID
}

# Function to run tests based on mode
run_parallel_tests() {
  local pids=()
  
  case $PARALLEL_MODE in
    suites)
      # Run all suites in parallel with default browser
      for suite in "${TEST_SUITES[@]}"; do
        pid=$(run_test_pod "$suite" "chromium")
        pids+=($pid)
      done
      ;;
    
    browsers)
      # Run all browsers in parallel for all suites
      for browser in "${BROWSERS[@]}"; do
        for suite in "${TEST_SUITES[@]}"; do
          pid=$(run_test_pod "$suite" "$browser")
          pids+=($pid)
        done
      done
      ;;
    
    all)
      # Run everything in parallel (use with caution - resource intensive)
      for suite in "${TEST_SUITES[@]}"; do
        for browser in "${BROWSERS[@]}"; do
          pid=$(run_test_pod "$suite" "$browser")
          pids+=($pid)
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

# Main execution
main() {
  local start_time=$(date +%s)
  
  # Start the base services (database and app)
  echo -e "${YELLOW}🔧 Starting base services...${NC}"
  docker compose -f "$COMPOSE_FILE" up -d postgres nextjs_app
  
  # Wait for services to be healthy
  echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
  sleep 10 # Give services time to start
  
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
    echo -e "${YELLOW}🧹 Cleaning up containers...${NC}"
    docker compose -f "$COMPOSE_FILE" down -v
    echo -e "${GREEN}✅ Cleanup completed${NC}"
  fi
  
  # Generate summary report
  echo ""
  echo -e "${YELLOW}📋 Test Results Summary:${NC}"
  echo "================================"
  for log_file in "$RESULTS_DIR"/*.log; do
    if [ -f "$log_file" ]; then
      suite_name=$(basename "$log_file" .log)
      if grep -q "failed" "$log_file"; then
        echo -e "${RED}❌ $suite_name: FAILED${NC}"
      else
        echo -e "${GREEN}✅ $suite_name: PASSED${NC}"
      fi
    fi
  done
  echo "================================"
  
  exit $exit_code
}

# Run the main function
main