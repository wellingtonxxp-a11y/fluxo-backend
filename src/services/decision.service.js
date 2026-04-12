function generateInstruction(cluster, place) {
  const { trend, predicted, acceleration } = cluster;

  let action = "stay";
  let message = "";

  // 🔥 DECISÃO PRINCIPAL
  if (trend === "rising" && predicted >= 5) {
    action = "go";
    message = `Vá para ${place.name}, alta chance de corridas agora`;
  } 
  else if (trend === "stable" && predicted >= 3) {
    action = "hold";
    message = `Permaneça na região, fluxo constante`;
  } 
  else if (trend === "falling") {
    action = "avoid";
    message = `Evite essa área, demanda em queda`;
  } 
  else {
    action = "explore";
    message = `Explore áreas próximas, baixa atividade atual`;
  }

  // 🔥 INTENSIDADE (feedback visual)
  let intensity = "low";

  if (predicted >= 8) intensity = "high";
  else if (predicted >= 4) intensity = "medium";

  return {
    action,
    message,
    intensity,
    predicted,
    trend,
    acceleration
  };
}

module.exports = {
  generateInstruction
};