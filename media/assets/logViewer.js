const vscode = acquireVsCodeApi();
const savedState = vscode.getState() ?? {};

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

const logViewer = {
  logs: [],
  filters: savedState.filters ?? { timestamp: "", severity: "", message: "" },
  severities: [],
  filteredLogs: [],
  loading: true,
  loadingError: "",
  fileSize: 0,
  limitInBytes: 0,
  page: savedState.page ?? 1,
  pageSize: savedState.pageSize ?? 50,
  requestId: savedState.requestId ?? 0,
  copy: {
    isLoading: false,
  },
  modal: {
    text: "",
    wrap: savedState.modalWrap ?? false,
  },
  regex: {
    patterns: {},
    test: "",
    testName: "",
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
  get hasSavedPatterns() {
    return Object.keys(this.regex.patterns).length > 0;
  },
  get hasMore() {
    return this.fileSize > this.limitInBytes;
  },
  async init() {
    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.command === "loadLogs") {
        if (message.requestId !== this.requestId) {
          return;
        }

        this.loading = false;
        if (message.error) {
          this.loadingError = message.message;
          this.logs = [];
          this.filteredLogs = [];
          return;
        }

        this.loadingError = "";
        this.logs = message.logs;
        this.severities = message.severities;
        this.regex.set = message.regexPattern ?? null;
        this.limitInBytes = message.limitInBytes;
        this.fileSize = message.fileSize;
        this.applyFilters(false);
        this.page = Math.min(this.page, this.totalPages);
        this.persistState();
      } else if (message.command === "loadStore") {
        this.regex.patterns = message.store.regexPatterns;
      }
    });

    vscode.postMessage({
      type: "command",
      command: "ready",
      parameters: { requestId: this.requestId },
    });
  },
  applyFilters(resetPage = true) {
    this.filteredLogs = this.logs.filter((log) => {
      return (
        (!this.filters.timestamp || log.timestamp.includes(this.filters.timestamp)) &&
        (!this.filters.severity || log.severity.toLocaleUpperCase() === this.filters.severity.toLocaleUpperCase()) &&
        (!this.filters.message || log.text.toLocaleUpperCase().includes(this.filters.message.toLocaleUpperCase()))
      );
    });
    if (resetPage) {
      this.page = 1;
    }
    this.persistState();
  },
  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.persistState();
    }
  },
  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.persistState();
    }
  },
  firstPage() {
    this.page = 1;
    this.persistState();
  },
  lastPage() {
    this.page = this.totalPages;
    this.persistState();
  },
  setPageSize() {
    this.pageSize = Number(this.pageSize);
    this.page = 1;
    this.persistState();
  },
  clearFilters() {
    for (const key in this.filters) {
      this.filters[key] = "";
    }
    this.applyFilters();
  },
  severityClass(severity) {
    const normalizedSeverity = severity.toLocaleUpperCase();
    if (["EMERGENCY", "ALERT", "CRITICAL", "ERROR"].includes(normalizedSeverity)) {
      return "severity-error";
    }
    if (["WARNING", "WARN"].includes(normalizedSeverity)) {
      return "severity-warning";
    }
    if (["INFO", "NOTICE"].includes(normalizedSeverity)) {
      return "severity-info";
    }
    if (normalizedSeverity === "DEBUG") {
      return "severity-debug";
    }
    return "severity-default";
  },
  formatMessage(message) {
    if (message.length > 180) {
      return message.substring(0, 180) + "...";
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
    } catch {
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
  toggleWrap() {
    this.modal.wrap = !this.modal.wrap;
    this.persistState();
  },
  async refresh(parameters = {}) {
    this.loading = true;
    this.loadingError = "";
    this.page = 1;
    this.requestId++;

    this.persistState();
    vscode.postMessage({
      type: "command",
      command: "refresh",
      parameters: { ...parameters, requestId: this.requestId },
    });
  },
  changeFormat(pattern = null) {
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
  persistState() {
    vscode.setState({
      filters: this.filters,
      page: this.page,
      pageSize: this.pageSize,
      requestId: this.requestId,
      modalWrap: this.modal.wrap,
    });
  },
};
