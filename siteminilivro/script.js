document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const mergeButton = document.getElementById('mergeButton');
    const downloadLink = document.getElementById('downloadLink');
    let selectedFile;

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragover');
        selectedFile = event.dataTransfer.files[0];
        if (selectedFile.type === 'application/pdf') {
            dropZone.textContent = selectedFile.name;
        } else {
            alert('Please drop a PDF file.');
        }
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        selectedFile = event.target.files[0];
        if (selectedFile.type === 'application/pdf') {
            dropZone.textContent = selectedFile.name;
        } else {
            alert('Please select a PDF file.');
        }
    });

    mergeButton.addEventListener('click', async () => {
        if (!selectedFile) {
            alert('Please select a PDF file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const existingPdfBytes = new Uint8Array(event.target.result);
            const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
            const outputPdfDoc = await PDFLib.PDFDocument.create();
            const totalPages = pdfDoc.getPageCount();

            for (let i = 0; i < totalPages; i += 4) {
                const newPage = outputPdfDoc.addPage([595.28, 841.89]);
                const pages = [];
                for (let j = 0; j < 4 && i + j < totalPages; j++) {
                    const [page] = await pdfDoc.copyPages(pdfDoc, [i + j]);
                    pages.push(page);
                }

                const embeddedPages = await Promise.all(pages.map((page) => outputPdfDoc.embedPage(page)));
                const positions = [
                    { x: 0, y: 420.945 },
                    { x: 297.64, y: 420.945 },
                    { x: 0, y: 0 },
                    { x: 297.64, y: 0 }
                ];

                for (let k = 0; k < embeddedPages.length; k++) {
                    const pos = positions[k];
                    newPage.drawPage(embeddedPages[k], { x: pos.x, y: pos.y, width: 297.64, height: 420.945 });
                }
            }

            const pdfBytes = await outputPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = selectedFile.name.replace('.pdf', '') + '_mini_livro.pdf';
            downloadLink.style.display = 'block';
            downloadLink.textContent = 'Download Merged PDF';
        };

        reader.readAsArrayBuffer(selectedFile);
    });
});
