export function cropAndCompressImage(
  imageSrc: string,
  targetWidth: number,
  targetHeight: number,
  zoom: number = 1,
  offsetX: number = 0,
  offsetY: number = 0,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !imageSrc) {
      return resolve(imageSrc);
    }

    let resolved = false;
    const safeResolve = (val: string) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(val);
      }
    };

    // Timeout de segurança máximo de 2.5s para evitar travamento da interface
    const timeoutId = setTimeout(() => {
      console.warn("Timeout ao comprimir imagem, utilizando imagem original.");
      safeResolve(imageSrc);
    }, 2500);

    const img = new Image();
    // NÃO definir crossOrigin em data: ou blob: para evitar travamentos/CORS no Safari/iOS
    if (!imageSrc.startsWith("data:") && !imageSrc.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }

    const processCanvas = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return safeResolve(imageSrc);

        // Fundo branco sólido para JPEGs limpos
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Cálculo de escala preservando proporção
        const naturalW = img.naturalWidth || img.width || targetWidth;
        const naturalH = img.naturalHeight || img.height || targetHeight;
        const imgAspect = naturalW / naturalH;
        const canvasAspect = targetWidth / targetHeight;

        let drawW = targetWidth;
        let drawH = targetHeight;

        if (imgAspect > canvasAspect) {
          drawH = targetHeight * zoom;
          drawW = drawH * imgAspect;
        } else {
          drawW = targetWidth * zoom;
          drawH = drawW / imgAspect;
        }

        // Proporção de deslocamento relativo ao container de preview (224px padrão do modal)
        const scaleFactorX = targetWidth / 224;
        const scaleFactorY = targetHeight / 224;
        const drawX = (targetWidth - drawW) / 2 + offsetX * scaleFactorX;
        const drawY = (targetHeight - drawH) / 2 + offsetY * scaleFactorY;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        safeResolve(dataUrl);
      } catch (e) {
        console.warn("Erro ao comprimir imagem via canvas:", e);
        safeResolve(imageSrc);
      }
    };

    img.onload = processCanvas;
    img.onerror = (err) => {
      console.warn("Falha ao carregar imagem para canvas:", err);
      safeResolve(imageSrc);
    };
    img.src = imageSrc;

    // Se já estiver em cache/completa
    if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
      processCanvas();
    }
  });
}

