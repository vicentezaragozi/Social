export const buildWhatsAppLink = (message: string, phoneNumber?: string) => {
  const encodedMessage = encodeURIComponent(message);
  if (phoneNumber && phoneNumber.trim().length > 0) {
    const sanitized = phoneNumber.replace(/[^+\d]/g, "");
    return `https://wa.me/${sanitized}?text=${encodedMessage}`;
  }
  return `https://wa.me/?text=${encodedMessage}`;
};

