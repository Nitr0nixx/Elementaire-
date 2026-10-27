// Démarrage (après la définition de tous les modules)
const hot = window.claude?.hot;
hot?.snapshot?.(() => ({S, screen}));
hot?.ready ? hot.ready(start) : start(hot?.data ?? {});
