const Benefit = Object.freeze({
  // Alimentação
  MEAL_VOUCHER: "meal_voucher", // Vale Refeição (Restaurantes)
  FOOD_VOUCHER: "food_voucher", // Vale Alimentação (Mercado)

  // Saúde e Bem-estar
  HEALTH_INSURANCE: "health_insurance", // Plano de Saúde
  DENTAL_INSURANCE: "dental_insurance", // Plano Odontológico
  LIFE_INSURANCE: "life_insurance", // Seguro de Vida
  GYM_PASS: "gym_pass", // Gympass / TotalPass / Auxílio Academia

  // Transporte
  TRANSPORT_VOUCHER: "transport_voucher", // Vale Transporte
  PARKING: "parking", // Estacionamento no local
  FUEL_ALLOWANCE: "fuel_allowance", // Auxílio Combustível

  // Cultura e Trabalho
  REMOTE_WORK: "remote_work", // Home Office / Trabalho Remoto
  HYBRID_WORK: "hybrid_work", // Modelo Híbrido
  FLEXIBLE_HOURS: "flexible_hours", // Horário Flexível
  BIRTHDAY_OFF: "birthday_off", // Folga no aniversário

  // Financeiro e Educação
  PROFIT_SHARING: "profit_sharing", // PLR / Bônus
  EDUCATION_ALLOWANCE: "education_allowance", // Auxílio Educação / Cursos
  CHILDCARE_ASSISTANCE: "childcare_assistance", // Auxílio Creche
});

module.exports = Benefit;
