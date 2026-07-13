const res = await fetch('https://pdftr.oligami.workers.dev/jobs/9f742031-b906-4ca5-b533-492ac334b091/files/bilingual.pdf?receipt=31898750b51ebb6bac200c20130900598f76546bb4103433dde5c87ea1e0b71a');
console.log(await res.text());
