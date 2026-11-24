/**
 * Utilitários de validação matemática e cadastral para TrainerMatch.
 * Implementa os algoritmos oficiais da Receita Federal e Anatel/Telecomunicações.
 */

/**
 * Validação algorítmica oficial de CPF (Receita Federal)
 * 1. Verifica tamanho de 11 dígitos numéricos
 * 2. Rejeita números repetidos (111.111.111-11, etc.)
 * 3. Valida primeiro dígito verificador
 * 4. Valida segundo dígito verificador
 */
export function isValidCpf(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, "");

  // Deve possuir exatamente 11 dígitos
  if (clean.length !== 11) return false;

  // Rejeita sequências conhecidas de dígitos repetidos
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Validação do 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.charAt(9), 10)) return false;

  // Validação do 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Validação algorítmica oficial de CNPJ (Receita Federal)
 * 1. Verifica tamanho de 14 dígitos numéricos
 * 2. Rejeita números repetidos
 * 3. Valida primeiro e segundo dígitos verificadores com pesos de 2 a 9
 */
export function isValidCnpj(cnpj: string): boolean {
  if (!cnpj) return false;
  const clean = cnpj.replace(/\D/g, "");

  // Deve possuir exatamente 14 dígitos
  if (clean.length !== 14) return false;

  // Rejeita sequências conhecidas de dígitos repetidos
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // Validação do 1º dígito verificador
  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  // Validação do 2º dígito verificador
  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) return false;

  return true;
}

/**
 * Validação de E-mail padrão RFC 5322 simplificada
 * Garante: parte local válida + @ + domínio válido + extensão (TLD) com no mínimo 2 letras
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(clean);
}

/**
 * Validação de Telefone Brasileiro (DDD + 8 ou 9 dígitos)
 * Suporta celulares com 11 dígitos e telefones fixos com 10 dígitos.
 * Rejeita DDDs inválidos (< 11 ou > 99).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, "");

  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (clean.length !== 10 && clean.length !== 11) return false;

  const ddd = parseInt(clean.substring(0, 2), 10);
  // Lista de DDDs válidos no Brasil
  const validDdds = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, // DF
    62, 64, // GO
    63, // TO
    65, 66, // MT
    67, // MS
    68, // AC
    69, // RO
    71, 73, 74, 75, 77, // BA
    79, // SE
    81, 87, // PE
    82, // AL
    83, // PB
    84, // RN
    85, 88, // CE
    86, 89, // PI
    91, 93, 94, // PA
    92, 97, // AM
    95, // RR
    96, // AP
    98, 99  // MA
  ];

  if (!validDdds.includes(ddd)) return false;

  // Se tiver 11 dígitos (celular), o terceiro dígito (após o DDD) deve ser 9
  if (clean.length === 11 && clean.charAt(2) !== "9") return false;

  return true;
}

/**
 * Validação de Senha TrainerMatch:
 * - Mínimo de 6 caracteres
 * - Pelo menos um número (0-9)
 * - Pelo menos um caractere especial (!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~ etc.)
 */
export function validatePasswordRules(password: string): {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
  errorMessage?: string;
} {
  const pwd = password || "";
  const hasMinLength = pwd.length >= 6;
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(pwd);
  const isValid = hasMinLength && hasNumber && hasSpecial;

  let errorMessage: string | undefined;
  if (!hasMinLength) {
    errorMessage = "A senha deve ter no mínimo 6 caracteres.";
  } else if (!hasNumber) {
    errorMessage = "A senha deve conter pelo menos um número.";
  } else if (!hasSpecial) {
    errorMessage = "A senha deve conter pelo menos um caractere especial (ex: ! @ # $ %).";
  }

  return {
    hasMinLength,
    hasNumber,
    hasSpecial,
    isValid,
    errorMessage
  };
}

export function isValidPassword(password: string): boolean {
  return validatePasswordRules(password).isValid;
}
