const JobApplicationStatus = Object.freeze({
  // 1. Entrada
  APPLIED: 'applied', // Candidato aplicou, currículo ainda não foi lido/processado.

  // 2. Análise Inicial
  REVIEWING: 'reviewing', // Recrutador está analisando o CV (Triagem).

  // 3. Processo Ativo
  INTERVIEWING: 'interviewing', // Candidato passou da triagem e está em testes/entrevistas.

  // 4. Decisão (Sucesso)
  OFFER_SENT: 'offer_sent', // (Opcional) Proposta feita, aguardando aceite do aluno.
  HIRED: 'hired', // Aprovado e Contratado. 

  // 5. Saída (Encerramento)
  REJECTED: 'rejected', // Reprovado pela empresa 
  WITHDRAWN: 'withdrawn', // Candidato desistiu 

  // 6. Exceção
  EXPIRED: 'expired', // A vaga foi fechada/cancelada antes da conclusão deste processo.
});

module.exports = JobApplicationStatus;
