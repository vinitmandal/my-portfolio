const variants = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  muted: 'btn btn-muted',
};

export default function Button({ children, variant = 'primary', className = '', as: Component = 'button', ...props }) {
  const mergedClassName = `${variants[variant] || variants.primary} ${className}`.trim();

  return (
    <Component className={mergedClassName} {...props}>
      {children}
    </Component>
  );
}
