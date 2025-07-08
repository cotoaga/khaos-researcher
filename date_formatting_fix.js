// Replace your broken date formatting in public/index.html with this:

function formatModelDate(created) {
    // Handle various timestamp formats
    if (!created || created === null || created === undefined) {
        return 'Unknown';
    }
    
    let timestamp;
    if (typeof created === 'string') {
        timestamp = new Date(created);
    } else if (typeof created === 'number') {
        // Handle both seconds and milliseconds timestamps
        timestamp = created > 1000000000000 
            ? new Date(created)           // Already milliseconds
            : new Date(created * 1000);   // Convert seconds to milliseconds
    } else {
        return 'Invalid Date';
    }
    
    // Check if date is valid
    if (isNaN(timestamp.getTime())) {
        return 'Invalid Date';
    }
    
    // Return ISO format: YYYY-MM-DD HH:MM:SS
    return timestamp.getFullYear() + '-' + 
           String(timestamp.getMonth() + 1).padStart(2, '0') + '-' + 
           String(timestamp.getDate()).padStart(2, '0') + ' ' +
           String(timestamp.getHours()).padStart(2, '0') + ':' + 
           String(timestamp.getMinutes()).padStart(2, '0') + ':' + 
           String(timestamp.getSeconds()).padStart(2, '0');
}

// In your renderModelGrid() function, replace the broken date code with:
renderModelGrid() {
    const grid = document.getElementById('model-grid');
    grid.innerHTML = '';
    
    this.currentModels.forEach(model => {
        const card = document.createElement('div');
        card.className = 'model-card';
        
        // Use the fixed date formatting function
        const formattedDate = formatModelDate(model.created);
        
        card.innerHTML = `
            <h3>${model.id}</h3>
            <p><strong>Provider:</strong> ${model.provider}</p>
            <p><strong>Capabilities:</strong> ${(model.capabilities || []).join(', ') || 'None listed'}</p>
            <p><strong>Created:</strong> ${formattedDate}</p>
        `;
        grid.appendChild(card);
    });
}

// Also fix the updateStats() function:
updateStats() {
    const totalModels = this.currentModels.length;
    const providers = new Set(this.currentModels.map(m => m.provider)).size;
    const lastUpdate = this.modelData.metadata?.lastUpdate || 'Unknown';
    
    document.getElementById('total-models').textContent = totalModels;
    document.getElementById('total-providers').textContent = providers;
    
    // Fix the last update date formatting too
    if (lastUpdate !== 'Unknown') {
        const updateDate = new Date(lastUpdate);
        if (!isNaN(updateDate.getTime())) {
            const formattedUpdate = updateDate.getFullYear() + '-' + 
                String(updateDate.getMonth() + 1).padStart(2, '0') + '-' + 
                String(updateDate.getDate()).padStart(2, '0') + ' ' +
                String(updateDate.getHours()).padStart(2, '0') + ':' + 
                String(updateDate.getMinutes()).padStart(2, '0') + ':' + 
                String(updateDate.getSeconds()).padStart(2, '0');
            document.getElementById('last-update').textContent = formattedUpdate;
        } else {
            document.getElementById('last-update').textContent = 'Invalid Date';
        }
    } else {
        document.getElementById('last-update').textContent = 'Unknown';
    }
}