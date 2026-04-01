const JobOpeningStatus = Object.freeze({
  // vaga aberta
  OPEN: 'open',
  // vaga em rascunho
  DRAFT: 'draft',
  // vaga fechada por motivo administrativo
  CLOSED: 'closed',
  // vaga pausada
  ON_HOLD: 'on_hold',
  // vaga finalizada com contratação de estudante
  HIRED: 'hired',
});

module.exports = JobOpeningStatus;
