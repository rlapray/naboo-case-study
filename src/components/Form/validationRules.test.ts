import { describe, expect, it } from "vitest";
import {
  cityValidation,
  descriptionValidation,
  emailValidation,
  firstNameValidation,
  lastNameValidation,
  nameValidation,
  passwordValidation,
  priceValidation,
} from "./validationRules";

describe("validationRules — French error messages", () => {
  it("returns French messages on invalid user inputs", () => {
    expect(emailValidation("not-an-email")).toBe("Email invalide");
    expect(passwordValidation("")).toBe("Mot de passe requis");
    expect(firstNameValidation("")).toBe("Prénom requis");
    expect(lastNameValidation("")).toBe("Nom requis");
  });

  it("returns French messages on invalid activity inputs", () => {
    expect(nameValidation("")).toBe("Nom requis");
    expect(descriptionValidation("")).toBe("Description requise");
    expect(cityValidation("")).toBe("Localisation requise");
    expect(priceValidation(0)).toBe("Prix requis et supérieur à 0");
  });

  it("returns null when the value is valid", () => {
    expect(emailValidation("a@b.co")).toBeNull();
    expect(priceValidation(10)).toBeNull();
    expect(nameValidation("Yoga")).toBeNull();
  });
});
