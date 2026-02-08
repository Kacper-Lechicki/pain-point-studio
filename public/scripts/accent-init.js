// Accent color initialization — runs before React hydration to prevent FOUC.
// Reads the user's accent preference from localStorage and applies
// the corresponding data-accent attribute on <html>.
(function () {
  try {
    var a = localStorage.getItem('accent');
    
    if (a && ['blue', 'teal', 'indigo'].indexOf(a) !== -1) {
      document.documentElement.setAttribute('data-accent', a);
    }

  } catch (e) {}
})();
