import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type TipoNotificacao = 'modulo' | 'feed' | 'comunidade';
export type TipoEvento = 'novo' | 'atualizacao' | 'comentario' | 'curtida';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  evento: TipoEvento;
  titulo: string;
  mensagem: string;
  link?: string;
  lida: boolean;
  created_at: string;
  data?: {
    post_id?: string;
    modulo_id?: string;
    usuario_id?: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [permissaoNotificacoes, setPermissaoNotificacoes] = useState<NotificationPermission>('default');

  // Carregar notificações do localStorage
  useEffect(() => {
    if (!user) return;

    const stored = localStorage.getItem(`notifications_${user.id}`);
    if (stored) {
      const parsed = JSON.parse(stored) as Notificacao[];
      setNotificacoes(parsed);
      setNotificacoesNaoLidas(parsed.filter(n => !n.lida).length);
    }

    // Verificar permissão de notificações
    if ('Notification' in window) {
      setPermissaoNotificacoes(Notification.permission);
    }
  }, [user]);

  // Salvar notificações no localStorage
  const salvarNotificacoes = (novasNotificacoes: Notificacao[]) => {
    if (!user) return;
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(novasNotificacoes));
    setNotificacoes(novasNotificacoes);
    setNotificacoesNaoLidas(novasNotificacoes.filter(n => !n.lida).length);
  };

  // Solicitar permissão de notificações push
  const solicitarPermissao = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissaoNotificacoes('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermissaoNotificacoes('denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissaoNotificacoes(permission);
    return permission === 'granted';
  };

  // Adicionar nova notificação
  const adicionarNotificacao = (
    tipo: TipoNotificacao,
    evento: TipoEvento,
    titulo: string,
    mensagem: string,
    link?: string,
    data?: Notificacao['data']
  ) => {
    const novaNotificacao: Notificacao = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      tipo,
      evento,
      titulo,
      mensagem,
      link,
      lida: false,
      created_at: new Date().toISOString(),
      data,
    };

    const novasNotificacoes = [novaNotificacao, ...notificacoes];
    salvarNotificacoes(novasNotificacoes);

    // Mostrar notificação push se permitido
    if (permissaoNotificacoes === 'granted') {
      new Notification(titulo, {
        body: mensagem,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: novaNotificacao.id,
        requireInteraction: false,
      }).onclick = () => {
        if (link) {
          window.focus();
          window.location.href = link;
        }
      };
    }

    return novaNotificacao;
  };

  // Marcar notificação como lida
  const marcarComoLida = (id: string) => {
    const atualizadas = notificacoes.map(n =>
      n.id === id ? { ...n, lida: true } : n
    );
    salvarNotificacoes(atualizadas);
  };

  // Marcar todas como lidas
  const marcarTodasComoLidas = () => {
    const atualizadas = notificacoes.map(n => ({ ...n, lida: true }));
    salvarNotificacoes(atualizadas);
  };

  // Remover notificação
  const removerNotificacao = (id: string) => {
    const atualizadas = notificacoes.filter(n => n.id !== id);
    salvarNotificacoes(atualizadas);
  };

  // Limpar todas as notificações
  const limparTodas = () => {
    if (!user) return;
    localStorage.removeItem(`notifications_${user.id}`);
    setNotificacoes([]);
    setNotificacoesNaoLidas(0);
  };

  return {
    notificacoes,
    notificacoesNaoLidas,
    permissaoNotificacoes,
    solicitarPermissao,
    adicionarNotificacao,
    marcarComoLida,
    marcarTodasComoLidas,
    removerNotificacao,
    limparTodas,
  };
};

