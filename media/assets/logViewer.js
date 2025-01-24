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
        this.filteredLogs = [...this.logs];

        if (this.logs.length > 0 && this.regex.test) {
          vscode.postMessage({ command: "addToStore", parameters: { regex: this.regex.test } });
          this.regex.test = "";
        }
      } else if (message.command === "loadStore") {
        console.log(message.store);
        console.log(message.store.regexPatterns);

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
    console.log({ text });

    this.modal.text = text;
    document.querySelector("dialog").showModal();
  },
  closeModal() {
    document.querySelector("dialog").close();
    this.modal.text = "";
  },
  refresh() {
    this.loading = true;
    // Clear all filters:
    for (const key in this.filters) {
      this.filters[key] = "";
    }
    vscode.postMessage({ type: "command", command: "refresh", parameters: {} });
  },
  changeFormat(pattern = null) {
    if (!pattern) {
      // If no pattern, we're doing the test format:
      vscode.postMessage({ type: "command", command: "refresh", parameters: { pattern: this.regex.test } });
    } else {
      vscode.postMessage({ type: "command", command: "refresh", parameters: { pattern } });
    }
  },
};
