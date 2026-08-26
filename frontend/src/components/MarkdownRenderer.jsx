import React, { useState } from "react";

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-body">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          return <CodeBlock key={index} rawBlock={part} />;
        }
        return <FormattedText key={index} text={part} />;
      })}
    </div>
  );
}

function CodeBlock({ rawBlock }) {
  const [copied, setCopied] = useState(false);

  // Extract language and code
  const lines = rawBlock.slice(3, -3).trim().split("\n");
  let language = "code";
  let codeLines = lines;

  if (lines.length > 0 && /^[a-zA-Z0-9_-]+$/.test(lines[0].trim())) {
    language = lines[0].trim();
    codeLines = lines.slice(1);
  }

  const codeText = codeLines.join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-lang-badge">{language.toUpperCase()}</span>
        <button className="code-copy-btn" onClick={handleCopy} title="Copy code">
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{codeText}</code>
      </pre>
    </div>
  );
}

function FormattedText({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let currentList = [];
  let listType = null; // 'ul' or 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === "ol") {
        elements.push(
          <ol key={`ol-${elements.length}`} className="md-ol">
            {currentList.map((item, i) => (
              <li key={i}>{parseInline(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="md-ul">
            {currentList.map((item, i) => (
              <li key={i}>{parseInline(item)}</li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      elements.push(<div key={`sp-${idx}`} className="md-spacer" />);
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} className="md-h3">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${idx}`} className="md-h2">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${idx}`} className="md-h1">
          {parseInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }
    if (trimmed.startsWith("#### ")) {
      flushList();
      elements.push(
        <h4 key={`h4-${idx}`} className="md-h4">
          {parseInline(trimmed.slice(5))}
        </h4>
      );
      return;
    }

    // Ordered list item (1. Item)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      currentList.push(olMatch[2]);
      return;
    }

    // Unordered list item (- Item or * Item)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      currentList.push(trimmed.slice(2));
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="md-p">
        {parseInline(line)}
      </p>
    );
  });

  flushList();

  return <>{elements}</>;
}

function parseInline(text) {
  if (!text) return null;

  // Split by inline code `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code key={idx} className="inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Parse bold **text** and italic *text*
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 3) {
        return <strong key={`${idx}-${bIdx}`}>{bPart.slice(2, -2)}</strong>;
      }
      return bPart;
    });
  });
}
