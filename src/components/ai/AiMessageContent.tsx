import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type AiMessageContentProps = {
  content: string
}

function replaceLatexCommands(content: string) {
  return content
    .replace(
      /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,
      '($1)/($2)',
    )
    .replace(/\^\{2\}/g, '²')
    .replace(/\^\{3\}/g, '³')
    .replace(
      /\\(?:bigl|bigr|Bigl|Bigr|biggl|biggr|Biggl|Biggr|left|right)\b/g,
      '',
    )
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\pm\b/g, '±')
    .replace(/\\(?:le|leq)\b/g, '≤')
    .replace(/\\(?:ge|geq)\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)')
    .replace(/\\boxed\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\(?:text|mathrm)\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\[,;!]\s*/g, ' ')
}

function normalizeAiContent(content: string) {
  const readableDelimiters = content
    .replace(
      /\$\$([\s\S]*?)\$\$/g,
      (_, expression: string) =>
        `\n\n${replaceLatexCommands(expression).trim()}\n\n`,
    )
    .replace(
      /\$([^$\n]+)\$/g,
      (_, expression: string) =>
        replaceLatexCommands(expression).trim(),
    )
    .replace(
      /\\\[([\s\S]*?)\\\]/g,
      (_, expression: string) =>
        `\n\n${replaceLatexCommands(expression).trim()}\n\n`,
    )
    .replace(
      /\\\(([\s\S]*?)\\\)/g,
      (_, expression: string) =>
        replaceLatexCommands(expression).trim(),
    )

  return replaceLatexCommands(readableDelimiters).replace(
    /\n{3,}/g,
    '\n\n',
  )
}

export function AiMessageContent({ content }: AiMessageContentProps) {
  return (
    <div className="ai-message-content break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {children}
            </a>
          ),
        }}
      >
        {normalizeAiContent(content)}
      </ReactMarkdown>
    </div>
  )
}
