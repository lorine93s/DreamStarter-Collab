import { FC } from "react";

interface ButtonLoaderProps {
  className?: string;
}

const ButtonLoader: FC<ButtonLoaderProps> = ({ className }) => {
  return (
    <div
      className={`${className} h-6 w-6 animate-spin rounded-[50%] border-4 border-white`}
    />
  );
};

export default ButtonLoader;
