import { useToast } from '@/hooks/use-toast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

// Food forms already publish operation results. Render them once so failures
// cannot disappear into an unmounted toast store; failed forms remain open.
export function FoodNotifications() {
  const { toasts } = useToast();
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} duration={props.variant === 'destructive' ? Infinity : 6000}
          className="bg-slate-800 text-slate-100 border-slate-600">
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose aria-label="Dismiss notification" />
        </Toast>
      ))}
      <ToastViewport style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }} />
    </ToastProvider>
  );
}
