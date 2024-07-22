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

            const sequence = generateSequence(totalPages);
            const embeddedPages = await Promise.all(sequence.map(async (pageIndex) => {
                const [page] = await pdfDoc.copyPages(pdfDoc, [pageIndex]);
                return await outputPdfDoc.embedPage(page);
            }));

            for (let i = 0; i < embeddedPages.length; i += 4) {
                const newPage = outputPdfDoc.addPage([595.28, 841.89]); // A4 tamanho em pontos [width, height]
                const positions = [
                    { x: 0, y: 420.945 },
                    { x: 297.64, y: 420.945 },
                    { x: 0, y: 0 },
                    { x: 297.64, y: 0 }
                ];

                for (let j = 0; j < 4 && i + j < embeddedPages.length; j++) {
                    const pos = positions[j];
                    newPage.drawPage(embeddedPages[i + j], { x: pos.x, y: pos.y, width: 297.64, height: 420.945 });
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

    function generateSequence(totalPages) {
        const sequence = [];
        const midPoint = Math.ceil(totalPages / 2);

        let forward = midPoint;
        let backward = midPoint - 1;

        while (sequence.length < totalPages) {
            if (forward < totalPages) {
                sequence.push(forward);
                forward++;
            }
            if (sequence.length < totalPages && backward >= 0) {
                sequence.push(backward);
                backward--;
            }
        }

        return sequence;
    }
});
