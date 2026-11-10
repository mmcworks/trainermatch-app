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

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imageSrc);

        // Fundo branco sólido para JPEGs limpos
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Cálculo de escala preservando proporção
        const imgAspect = img.width / img.height;
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
        resolve(dataUrl);
      } catch (e) {
        console.warn("Erro ao comprimir imagem via canvas:", e);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
