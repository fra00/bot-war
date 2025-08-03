import React, { useState } from "react";
import PropTypes from "prop-types";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import CardFooter from "../ui/CardFooter";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Alert from "../ui/Alert";

const AuthForm = ({ onLogin, onRegister, loading, error, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(formData.email, formData.password);
    } else {
      onRegister(formData.email, formData.password);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>{isLogin ? "Login" : "Registrazione"}</CardHeader>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}
        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
          variant="primary"
        >
          {loading ? "Caricamento..." : isLogin ? "Accedi" : "Registrati"}
        </Button>
        <Button
          onClick={toggleMode}
          type="button"
          variant="ghost"
          className="w-full"
        >
          {isLogin
            ? "Non hai un account? Registrati"
            : "Hai già un account? Accedi"}
        </Button>
      </form>
      <CardFooter>
        <Button onClick={onBack} variant="secondary" className="w-full">
          Indietro
        </Button>
      </CardFooter>
    </Card>
  );
};

AuthForm.propTypes = {
  /** Funzione da chiamare per il login. */
  onLogin: PropTypes.func.isRequired,
  /** Funzione da chiamare per la registrazione. */
  onRegister: PropTypes.func.isRequired,
  /** Indica se è in corso un'operazione di caricamento. */
  loading: PropTypes.bool,
  /** Messaggio di errore da visualizzare. */
  error: PropTypes.string,
  /** Funzione per tornare indietro. */
  onBack: PropTypes.func,
};

AuthForm.defaultProps = {
  loading: false,
  error: null,
  onLogin: (email, password) => console.log("Login:", { email, password }),
  onRegister: (email, password) =>
    console.log("Register:", { email, password }),
  onBack: () => console.log("Back button clicked"),
};

export default AuthForm;