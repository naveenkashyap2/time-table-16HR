export default function Card({
  as: Tag = 'section',
  title,
  icon: Icon,
  action,
  children,
  padding = 'md',
  hover = false,
  className = '',
  ...rest
}) {
  return (
    <Tag
      className={['card', padding === 'lg' ? 'card-pad-lg' : '', hover ? 'card-hover' : '', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {(title || action) && (
        <header className="card-head">
          {title ? (
            <h2 className="card-title">
              {Icon ? <Icon size={18} aria-hidden="true" /> : null}
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}
      {children}
    </Tag>
  );
}
