import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Button — single source of truth for interactive affordances.
 * Renders <button>, <a> or <Link> depending on the props given.
 * Touch target is >= 44px via the .btn class (§12.1).
 */
const Button = forwardRef(function Button(
  {
    variant = 'ghost',
    size = 'md',
    block = false,
    icon: Icon,
    iconRight: IconRight,
    iconOnly = false,
    children,
    className = '',
    to,
    href,
    ...rest
  },
  ref,
) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    block ? 'btn-block' : '',
    iconOnly ? 'btn-icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {Icon ? <Icon size={size === 'sm' ? 15 : 17} aria-hidden="true" /> : null}
      {iconOnly ? null : children}
      {IconRight ? <IconRight size={size === 'sm' ? 15 : 17} aria-hidden="true" /> : null}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} rel="noreferrer noopener" {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type="button" className={classes} {...rest}>
      {content}
    </button>
  );
});

export default Button;
