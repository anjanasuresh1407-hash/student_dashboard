window.addEventListener('DOMContentLoaded', function () {
  const flashes = document.querySelectorAll('.flash');
  if (flashes.length) {
    setTimeout(() => {
      flashes.forEach((flash) => {
        flash.style.transition = 'opacity 0.3s ease';
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 300);
      });
    }, 4000);
  }

  const aiBtn = document.getElementById('ai-btn');
  const aiSpinner = document.getElementById('ai-spinner');
  const aiResult = document.getElementById('ai-result');

  if (aiBtn) {
    aiBtn.addEventListener('click', function () {
      aiBtn.style.display = 'none';
      if (aiSpinner) aiSpinner.style.display = 'inline-block';
      if (aiResult) aiResult.innerHTML = '';

      fetch('/api/ai-priority')
        .then((response) => response.json())
        .then((data) => {
          if (!Array.isArray(data)) {
            throw new Error('Invalid response');
          }
          const html = data.map((item) => {
            const typeClass = item.type === 'exam' ? 'badge-purple' : 'badge-blue';
            return `
              <div class="ai-item">
                <span class="ai-rank">${item.rank}</span>
                <div class="ai-content">
                  <div class="ai-item-name">${item.item} <span class="badge ${typeClass}">${item.type}</span></div>
                  <div class="ai-reason">${item.reason}</div>
                </div>
              </div>
            `;
          }).join('');
          if (aiResult) aiResult.innerHTML = html;
        })
        .catch(() => {
          if (aiResult) aiResult.innerHTML = '<div class="alert alert-red">Could not load priorities. Please try again.</div>';
          if (aiBtn) aiBtn.style.display = 'inline-flex';
        })
        .finally(() => {
          if (aiSpinner) aiSpinner.style.display = 'none';
        });
    });
  }
});
