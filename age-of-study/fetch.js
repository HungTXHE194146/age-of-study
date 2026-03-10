fetch("http://localhost:3000/api/admin/classes/debug-excel")
    .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
    })
    .then(console.log)
    .catch(console.error);
