document.addEventListener("alpine:init", () => {
  Alpine.data("logViewer", () => logViewer);
});

// Logic to enable click outside to close the dialog
const dialog = document.querySelector("dialog");
dialog.addEventListener("click", (event) => {
  if (!event.target.contains(dialog)) {
    return;
  }
  dialog.close();
});

const vscode = acquireVsCodeApi();
const logViewer = {
  logs: [],
  filters: { timestamp: "", severity: "", message: "" },
  severities: [],
  filteredLogs: [],
  loading: true,
  loadingError: "",
  fileSize: 0,
  limitInBytes: 0,
  page: 1,
  pageSize: 50,
  indexToShow: null,
  copy: {
    isLoading: false,
    success: false,
  },
  modalText: "",
  modal: {
    text: "",
    wrap: false,
  },
  regex: {
    patterns: [],
    test: "",
    set: null,
  },
  get totalPages() {
    return Math.max(Math.ceil(this.filteredLogs.length / this.pageSize), 1);
  },
  get hasNoLogs() {
    return this.filteredLogs.length === 0;
  },
  get pageLogs() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredLogs.slice(start, end);
  },
  get noFiltersApplied() {
    return Object.values(this.filters).every((value) => !value);
  },
  get hasMore() {
    return this.fileSize > this.limitInBytes;
  },
  async init() {
    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.command === "loadLogs") {
        this.loading = false;
        if (message.error) {
          // Set error message?
          this.loadingError = message.message;
          return;
        }

        this.logs = message.logs;
        this.severities = message.severities;
        this.regex.set = message.regexPattern ?? null;
        this.filteredLogs = [...this.logs];
        this.limitInBytes = message.limitInBytes;
        this.fileSize = message.fileSize;
      } else if (message.command === "loadStore") {
        this.regex.patterns = message.store.regexPatterns;
      }
    });
  },
  applyFilters() {
    this.filteredLogs = this.logs.filter((log) => {
      return (
        (!this.filters.timestamp || log.timestamp.includes(this.filters.timestamp)) &&
        (!this.filters.severity || log.severity.toLocaleUpperCase() === this.filters.severity.toLocaleUpperCase()) &&
        (!this.filters.message || log.text.toLocaleUpperCase().includes(this.filters.message.toLocaleUpperCase()))
      );
    });
    this.page = 1;
  },
  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  },
  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
  },
  showDetails(idx) {
    if (this.indexToShow === idx) {
      this.indexToShow = null;
    } else {
      this.indexToShow = idx;
    }
  },
  formatMessage(message) {
    if (message.length > 100) {
      return message.substring(0, 100) + "...";
    } else {
      return message;
    }
  },
  async copyToClipboard(text) {
    this.copy.isLoading = true;
    try {
      await navigator.clipboard.writeText(text);
      // Send message to vs code:
      vscode.postMessage({ type: "info", message: "Copied to clipboard" });
    } catch (error) {
      vscode.postMessage({ type: "error", message: "Failed to copy to clipboard" });
    } finally {
      this.copy.isLoading = false;
    }
  },
  openModal(text) {
    this.modal.text = text;
    document.querySelector("dialog").showModal();
  },
  closeModal() {
    document.querySelector("dialog").close();
    this.modal.text = "";
  },
  async refresh(parameters = {}) {
    this.loading = true;
    // Clear all filters:
    for (const key in this.filters) {
      this.filters[key] = "";
    }

    vscode.postMessage({ type: "command", command: "refresh", parameters });
  },
  changeFormat(pattern = null) {
    // Send a refresh request with the pattern as a parameter
    this.refresh({ pattern: pattern || this.regex.test });
  },
  saveTestRegex() {
    vscode.postMessage({
      type: "command",
      command: "addToStore",
      parameters: { regex: { pattern: this.regex.test, name: this.regex.testName } },
    });
    this.regex.testName = "";
    this.regex.test = "";
  },
  deletePattern(pattern) {
    vscode.postMessage({
      type: "command",
      command: "deleteFromStore",
      parameters: { pattern },
    });
  },
  bytesToHumanReadable(inputBytes) {
    let bytes = inputBytes;
    const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let unitIndex = 0;
    while (bytes >= 1024) {
      bytes /= 1024;
      unitIndex++;
    }
    return `${bytes.toFixed(2)} ${units[unitIndex]}`;
  },
};
