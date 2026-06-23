window.addEventListener('DOMContentLoaded', function () {
  // 1. Premium Toast Notification Auto-Dismissal
  const flashes = document.querySelectorAll('.flash');
  if (flashes.length) {
    setTimeout(() => {
      flashes.forEach((flash) => {
        flash.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        flash.style.opacity = '0';
        flash.style.transform = 'translateY(-20px) scale(0.9)';
        setTimeout(() => {
          flash.remove();
          // Remove the container if no flashes remain
          const container = document.querySelector('.flash-container');
          if (container && !container.querySelectorAll('.flash').length) {
            container.remove();
          }
        }, 4000);
      });
    }, 4500);
  }

  // 2. Pre-fill study planner date to today
  const studyDateInput = document.getElementById('study_date');
  if (studyDateInput && !studyDateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    studyDateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // 3. AI Copilot Priority Generator
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
          
          if (data.length === 0) {
            if (aiResult) {
              aiResult.innerHTML = '<div class="alert alert-green"><i class="ti ti-circle-check"></i> No tasks or exams to prioritize!</div>';
            }
            return;
          }

          const html = data.map((item, index) => {
            const typeClass = item.type === 'exam' ? 'badge-purple' : 'badge-blue';
            const icon = item.type === 'exam' ? 'ti-award' : 'ti-checklist';
            // Staggered entrance animation delay
            const delay = index * 0.1;
            return `
              <div class="ai-item" style="opacity: 0; transform: translateX(-15px); animation: aiItemFadeIn 0.4s ease ${delay}s forwards;">
                <span class="ai-rank">${item.rank}</span>
                <div class="ai-content">
                  <div class="ai-item-name">
                    <span>${item.item}</span>
                    <span class="badge ${typeClass}"><i class="ti ${icon}"></i> ${item.type}</span>
                  </div>
                  <div class="ai-reason">${item.reason}</div>
                </div>
              </div>
            `;
          }).join('');
          
          // Inject custom keyframes for the fade-in stagger if not already in document
          if (!document.getElementById('ai-stagger-styles')) {
            const style = document.createElement('style');
            style.id = 'ai-stagger-styles';
            style.textContent = `
              @keyframes aiItemFadeIn {
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `;
            document.head.appendChild(style);
          }

          if (aiResult) aiResult.innerHTML = html;
        })
        .catch(() => {
          if (aiResult) {
            aiResult.innerHTML = '<div class="alert alert-red"><i class="ti ti-circle-x"></i> Could not load study plan priorities. Please try again.</div>';
          }
          if (aiBtn) aiBtn.style.display = 'inline-flex';
        })
        .finally(() => {
          if (aiSpinner) aiSpinner.style.display = 'none';
        });
    });
  }
});
