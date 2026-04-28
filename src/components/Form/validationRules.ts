type ValidationRule<T> = (value: T) => string | null;

const isValidEmail = (value: string) => {
  const at = value.indexOf("@");
  return at > 0 && at < value.length - 1 && value.includes(".", at + 2);
};
const isValidString = (value: string) => value.length > 0;
const isNumberGreaterThanZero = (value: number) => value > 0;

/**
 * User
 */
export const emailValidation: ValidationRule<string> = (value) =>
  isValidEmail(value) ? null : "Email invalide";

export const passwordValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Mot de passe requis";

export const firstNameValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Prénom requis";

export const lastNameValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Nom requis";

/**
 * Activity
 */
export const nameValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Nom requis";

export const descriptionValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Description requise";

export const cityValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Localisation requise";

export const priceValidation: ValidationRule<number> = (value) =>
  isNumberGreaterThanZero(value)
    ? null
    : "Prix requis et supérieur à 0";
