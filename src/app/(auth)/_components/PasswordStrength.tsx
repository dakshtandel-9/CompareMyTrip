function getStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function PasswordStrength({ password }: { password: string }) {
  const strength = getStrength(password);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-cmt-full transition-colors duration-200 ${
              i < strength ? "bg-cmt-primary-500" : "bg-cmt-neutral-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-cmt-neutral-500">
        Use 8+ characters with a mix of letters, numbers &amp; symbols
      </p>
    </div>
  );
}
