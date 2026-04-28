type ValidationRule<T> = (value: T) => string | null;

const isValidEmail = (value: string) => /^\S+@\S+$/.test(value);
const isValidString = (value: string) => value.length > 0;
const isNumberGreaterThanZero = (value: number) => value > 0;

/**
 * User
 */
export const emailValidation: ValidationRule<string> = (value) =>
  isValidEmail(value) ? null : "Invalid email";

export const passwordValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Password required";

export const firstNameValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "FirstName required";

export const lastNameValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "LastName required";

/**
 * Activity
 */
export const nameValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Name required";

export const descriptionValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Description required";

export const cityValidation: ValidationRule<string> = (value) =>
  isValidString(value) ? null : "Localisation required";

export const priceValidation: ValidationRule<number> = (value) =>
  isNumberGreaterThanZero(value)
    ? null
    : "Price required and must be greater than 0";
