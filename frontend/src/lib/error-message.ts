type ErrorLike = {
  message?: unknown;
};

type ValidationIssue = {
  message?: unknown;
  path?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toSentenceCase(fieldName: string) {
  if (!fieldName) return "";

  const withSpaces = fieldName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatIssue(issue: ValidationIssue) {
  if (typeof issue.message !== "string" || issue.message.trim() === "") {
    return null;
  }

  if (!Array.isArray(issue.path) || issue.path.length === 0) {
    return issue.message;
  }

  const fieldPath = issue.path
    .filter((part) => typeof part === "string" || typeof part === "number")
    .map((part) => String(part))
    .join(" ");

  const fieldLabel = toSentenceCase(fieldPath);

  if (!fieldLabel) {
    return issue.message;
  }

  const normalizedIssueMessage = issue.message.trim().toLowerCase();
  const normalizedFieldLabel = fieldLabel.toLowerCase();

  if (normalizedIssueMessage.startsWith(normalizedFieldLabel)) {
    return issue.message;
  }

  return `${fieldLabel}: ${issue.message}`;
}

function extractMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return extractMessage(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => {
        if (isRecord(item)) {
          return formatIssue(item);
        }

        return extractMessage(item);
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length === 0) {
      return null;
    }

    return messages.join(" ");
  }

  if (isRecord(value)) {
    if (typeof value.message === "string" && value.message.trim() !== "") {
      return value.message.trim();
    }

    if ("error" in value) {
      const nestedErrorMessage = extractMessage(value.error);
      if (nestedErrorMessage) {
        return nestedErrorMessage;
      }
    }

    if ("cause" in value) {
      const nestedCauseMessage = extractMessage(value.cause);
      if (nestedCauseMessage) {
        return nestedCauseMessage;
      }
    }
  }

  return null;
}

export function getUserFriendlyErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (isRecord(error)) {
    const errorMessage = extractMessage((error as ErrorLike).message);
    if (errorMessage) {
      return errorMessage;
    }
  }

  const directMessage = extractMessage(error);
  return directMessage ?? fallback;
}
