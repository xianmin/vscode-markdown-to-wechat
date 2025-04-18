import { useEffect, useState } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import './App.css';
function App({ vscode }) {
    const [markdown, setMarkdown] = useState('');
    const [html, setHtml] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // 处理从VSCode接收的消息
    useEffect(() => {
        const handleMessage = (event) => {
            const message = event.data;
            switch (message.type) {
                case 'setMarkdown':
                    setMarkdown(message.content);
                    break;
                default:
                    console.log('未知消息类型', message.type);
            }
        };
        window.addEventListener('message', handleMessage);
        // 通知VSCode WebView已准备好接收数据
        vscode.postMessage({ type: 'webviewReady' });
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [vscode]);
    // 当Markdown内容变化时，转换为HTML
    useEffect(() => {
        const convertMarkdown = async () => {
            if (!markdown)
                return;
            setIsLoading(true);
            setError(null);
            try {
                const result = await unified()
                    .use(remarkParse)
                    .use(remarkGfm)
                    .use(remarkRehype, { allowDangerousHtml: true })
                    .use(rehypeStringify, { allowDangerousHtml: true })
                    .process(markdown);
                setHtml(result.toString());
            }
            catch (err) {
                setError(`转换失败: ${err instanceof Error ? err.message : String(err)}`);
                console.error('Markdown转换错误:', err);
            }
            finally {
                setIsLoading(false);
            }
        };
        convertMarkdown();
    }, [markdown]);
    return (<div className="app-container">
      <div className="toolbar">
        <h1>微信公众号预览</h1>
        <button onClick={() => vscode.postMessage({ type: 'copyHtml', html })} disabled={isLoading || !html}>
          复制HTML
        </button>
      </div>

      <div className="preview-container">
        {isLoading && <div className="loading">正在转换...</div>}
        {error && <div className="error">{error}</div>}
        {html && <div className="preview-content" dangerouslySetInnerHTML={{ __html: html }}/>}
      </div>
    </div>);
}
export default App;
//# sourceMappingURL=App.js.map