// Client-side field validation for step 4 (contact data).
// Extend VALIDATION_RULES to add or change requirements before connecting to a real backend.

const VALIDATION_RULES = {
  name:     { required: true,  pattern: null,                           msg: 'El nombre es obligatorio.' },
  phone:    { required: true,  pattern: /^[0-9\s\+\-\(\)]{7,15}$/,    msg: 'Introduce un teléfono válido.' },
  email:    { required: true,  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,  msg: 'Introduce un email válido.' },
  location: { required: false, pattern: null,                           msg: '' }
};

// Returns true if step is valid (or if step !== 4).
// Marks invalid fields with --danger border colour.
function validateStep(step) {
  if (step !== 4) return true;
  let valid = true;
  for (const [field, rule] of Object.entries(VALIDATION_RULES)) {
    const el = $(field);
    if (!el) continue;
    const value       = el.value.trim();
    const isEmpty     = value === '';
    const failPattern = rule.pattern && !rule.pattern.test(value);
    if ((rule.required && isEmpty) || failPattern) {
      el.style.borderColor = 'var(--danger)';
      valid = false;
    } else {
      el.style.borderColor = '';
    }
  }
  return valid;
}

// Call on any contact field change to remove error state as the user types
function clearValidation() {
  Object.keys(VALIDATION_RULES).forEach(field => {
    const el = $(field);
    if (el) el.style.borderColor = '';
  });
}
