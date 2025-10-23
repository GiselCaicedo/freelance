import Footer from '@shared/components/layouts/Footer';
import Nav from '@shared/components/layouts/Nav';

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
    <div className="flex flex-1 flex-col">
      <main className="flex-1 p-6">{children}</main>
      <Footer />
    </div>
  </div>
);
