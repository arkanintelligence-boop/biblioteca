import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const { toast } = useToast();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isCreatingAccount) {
        // Criar nova conta provisória
        const { data, error } = await supabase
          .from('usuarios')
          .insert({
            email: email.trim(),
            password_hash: password, // Plain text (provisório)
            is_active: true,
            purchase_date: new Date().toISOString(),
            nome_exibicao: email.trim().split('@')[0], // Usa parte do email como nome
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            toast({
              title: 'Email já cadastrado',
              description: 'Este email já possui uma conta. Faça login ao invés de criar uma nova conta.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao criar conta',
              description: error.message || 'Ocorreu um erro ao criar a conta',
              variant: 'destructive',
            });
          }
          return;
        }

        // Success - save user and redirect
        setUser(data);
        toast({
          title: 'Conta criada!',
          description: 'Bem-vindo à Biblioteca Mística',
        });
        navigate('/dashboard');
      } else {
        // Login existente
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email.trim())
          .eq('password_hash', password) // Plain text comparison
          .eq('is_active', true)
          .single();

        if (error || !data) {
          toast({
            title: 'Erro ao fazer login',
            description: 'Email ou senha inválidos',
            variant: 'destructive',
          });
          return;
        }

        // Success - save user and redirect
        setUser(data);
        toast({
          title: 'Login realizado!',
          description: 'Bem-vindo à Biblioteca Mística',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: `Ocorreu um erro ao ${isCreatingAccount ? 'criar conta' : 'fazer login'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-card/50 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 inline-block">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img 
                  src="/logo.png" 
                  alt="Biblioteca Mística Logo" 
                  className="w-16 h-16 object-contain animate-logo-glow"
                />
              </picture>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Biblioteca Mística
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isCreatingAccount ? 'Crie sua conta' : 'Entre na sua área de membros'}
            </p>
          </div>

          {/* Toggle entre Login e Criar Conta */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingAccount(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isCreatingAccount
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingAccount(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCreatingAccount
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input/50 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input/50 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-primary-foreground font-semibold h-11"
              disabled={isLoading}
            >
              {isLoading 
                ? (isCreatingAccount ? 'Criando conta...' : 'Entrando...') 
                : (isCreatingAccount ? 'Criar Conta' : 'Entrar')
              }
            </Button>
          </form>

          {isCreatingAccount && (
            <p className="text-xs text-center text-yellow-500/80 mt-4 px-4">
              ⚠️ Esta é uma funcionalidade provisória. Use apenas para testes.
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground mt-6">
            {isCreatingAccount 
              ? 'Crie sua conta e comece a explorar a Biblioteca Mística'
              : 'Acesso exclusivo para membros da Biblioteca Mística'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
