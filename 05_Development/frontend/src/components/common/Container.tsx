import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'standard' | 'narrow' | 'wide' | 'fluid';
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  size = 'standard',
  children,
  className = '',
  style,
  ...props
}) => {
  let maxWidth = 'var(--container-standard)';
  if (size === 'narrow') maxWidth = 'var(--container-narrow)';
  if (size === 'wide') maxWidth = 'var(--container-wide)';
  if (size === 'fluid') maxWidth = '100%';

  return (
    <div
      className={className}
      style={{
        maxWidth,
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: 'var(--space-6)',
        paddingRight: 'var(--space-6)',
        width: '100%',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
