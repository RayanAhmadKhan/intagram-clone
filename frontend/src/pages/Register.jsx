import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import FormInput from "../components/FormInput";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", fullName: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) {
        const fieldErrors = {};
        res.errors.forEach((er) => (fieldErrors[er.field] = er.message));
        setErrors(fieldErrors);
      } else {
        setServerError(res?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-brand">Create account</h1>

        {serverError && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
        )}

        <FormInput
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          error={errors.username}
          placeholder="e.g. rayan.k"
          required
        />
        <FormInput
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Optional"
        />
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <FormInput
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-light"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPassword ? "Hide" : "Show"}
            </button>
          }
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-lg bg-brand py-2 font-medium text-white transition hover:bg-brand-light disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
