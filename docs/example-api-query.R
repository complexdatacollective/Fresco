# Example: Query the Fresco Interview Data API using R.
#
# Prerequisites:
#     install.packages(c("httr2", "jsonlite"))
#
# Usage:
#     1. Enable the Interview Data API in Fresco (Dashboard -> Settings).
#     2. Create an API token and copy it.
#     3. Set FRESCO_API_URL and FRESCO_API_TOKEN below (or as environment variables).
#     4. Run: Rscript example-api-query.R

library(httr2)
library(jsonlite)

FRESCO_API_URL <- Sys.getenv("FRESCO_API_URL", "https://your-fresco-instance.com")
FRESCO_API_TOKEN <- Sys.getenv("FRESCO_API_TOKEN", "your-api-token-here")

base_url <- paste0(FRESCO_API_URL, "/api/v1")

#' Fetch a paginated list of interviews.
#'
#' @param page Page number (default 1).
#' @param per_page Results per page (default 10, max 100).
#' @param protocol_id Optional protocol ID filter.
#' @param status Optional status filter: "completed" or "in-progress".
#' @return Parsed JSON response with `data` and `meta`.
list_interviews <- function(page = 1, per_page = 10, protocol_id = NULL, status = NULL) {
  req <- request(paste0(base_url, "/interview")) |>
    req_headers(Authorization = paste("Bearer", FRESCO_API_TOKEN)) |>
    req_url_query(page = page, perPage = per_page)

  if (!is.null(protocol_id)) req <- req |> req_url_query(protocolId = protocol_id)
  if (!is.null(status)) req <- req |> req_url_query(status = status)

  resp <- req |> req_perform()
  resp_body_json(resp)
}

#' Fetch a single interview with full network data.
#'
#' @param interview_id The interview ID.
#' @return Parsed JSON response with `data`.
get_interview <- function(interview_id) {
  req <- request(paste0(base_url, "/interview/", interview_id)) |>
    req_headers(Authorization = paste("Bearer", FRESCO_API_TOKEN))

  resp <- req |> req_perform()
  resp_body_json(resp)
}

#' Fetch all interviews across all pages.
#'
#' @param ... Additional arguments passed to list_interviews (e.g. status, protocol_id).
#' @return A data frame of all interviews.
get_all_interviews <- function(...) {
  all_data <- list()
  page <- 1

  repeat {
    result <- list_interviews(page = page, per_page = 100, ...)
    all_data <- c(all_data, result$data)

    if (page >= result$meta$pageCount) break
    page <- page + 1
  }

  # Convert list of interviews to a data frame
  do.call(rbind, lapply(all_data, function(interview) {
    data.frame(
      id = interview$id,
      participant_identifier = interview$participant$identifier,
      protocol_name = interview$protocol$name,
      start_time = interview$startTime,
      finish_time = ifelse(is.null(interview$finishTime), NA, interview$finishTime),
      current_step = interview$currentStep,
      stringsAsFactors = FALSE
    )
  }))
}

# --- Main ---

# List completed interviews (first page)
result <- list_interviews(status = "completed")
cat(sprintf("Total interviews: %d\n", result$meta$total))

for (interview in result$data) {
  cat(sprintf(
    "  %s  participant=%s  protocol=%s  finished=%s\n",
    interview$id,
    interview$participant$identifier,
    interview$protocol$name,
    ifelse(is.null(interview$finishTime), "NA", interview$finishTime)
  ))
}

# Fetch full network data for the first interview
if (length(result$data) > 0) {
  first_id <- result$data[[1]]$id
  detail <- get_interview(first_id)
  network <- detail$data$network

  cat(sprintf("\nInterview %s network:\n", first_id))
  cat(sprintf("  Nodes: %d\n", length(network$nodes)))
  cat(sprintf("  Edges: %d\n", length(network$edges)))
}
