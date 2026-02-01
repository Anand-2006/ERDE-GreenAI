export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

export const shareContent = async (text: string, title?: string, onFallback?: () => void): Promise<boolean> => {
  if (navigator.share && navigator.canShare && navigator.canShare({ text, title })) {
    try {
      await navigator.share({
        title: title || 'ERDE-GreenAI Optimization',
        text: text
      });
      return true;
    } catch (err: any) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError' && onFallback) {
        onFallback();
      }
      return false;
    }
  } else {
    // Fallback to copy
    if (onFallback) {
      onFallback();
    }
    return false;
  }
};
