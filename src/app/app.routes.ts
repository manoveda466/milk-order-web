import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { NavComponent } from './component/nav/nav.component';
import { CustomerInfoComponent } from './component/customer-info/customer-info.component';
import { OrdersComponent } from './component/orders/orders.component';
import { TokensComponent } from './component/tokens/tokens.component';
import { TokenBalanceComponent } from './component/token-balance/token-balance.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'nav', 
    component: NavComponent, 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'customers', pathMatch: 'full' },
      { path: 'customers', component: CustomerInfoComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'tokens', component: TokensComponent },
      { path: 'token-balance', component: TokenBalanceComponent }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
