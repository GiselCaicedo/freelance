import Nav from '@/shared/components/layouts/Nav';
import Footer from '@/shared/components/layouts/Footer';

export const BaseTemplate = ({
  children,
  leftNav,
  rightNav,
}: {
  children: React.ReactNode;
  leftNav?: React.ReactNode;
  rightNav?: React.ReactNode;
}) => (
  <div className="flex flex-row ">
    <Nav>
      {leftNav}
    </Nav>
    <div className="flex flex-col flex-1">
      <main className="flex-1 p-6">{children}</main>
      <Footer />
    </div>
  </div>
);