export const LARAVEL_LOG_REGEX_PATTERN =
  "^\\[(?<timestamp>\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}:\\d{2})[^\\]]*\\]\\s+(?<severity>[^:\\s]+):\\s?(?<text>.*)$";

export const MAX_BYTES_TO_READ = 5 * 1024 * 1024; // 5MB max for performance
export const MAX_REGEX_PATTERN_LENGTH = 1_000;
export const MAX_REGEX_NAME_LENGTH = 100;
