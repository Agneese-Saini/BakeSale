import { Routes } from '@angular/router'
import { Checkout } from './checkout/checkout';
import { Content } from './content/content';
import { CategoryContent } from './content/category-content';
import { Recipe } from './custom/recipe';
import { OrderHistory } from './user/order-history';
import { ViewReceipt } from './user/view-receipt';
import { RecipeBook } from './user/recipe-book';
import { ItemPage } from './content/itemPage';
import { Subscribe } from './custom/subscribe';
import { Subscriptions } from './user/subscriptions';
import { Home } from './home/home';
import { PageNotFound } from './app.404';
import { OrderPlaced } from './checkout/order-placed';
import { LoginGuard } from './user/user';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'shop',
        component: Content
    },
    {
        path: 'category',
        component: CategoryContent
    },
    {
        path: 'checkout',
        component: Checkout
    },
    {
        path: 'order-placed',
        component: OrderPlaced,
        canActivate: [LoginGuard]
    },
    {
        path: 'create',
        component: Recipe
    },
    {
        path: 'subscribe',
        component: Subscribe
    },
    {
        path: 'order-history',
        component: OrderHistory,
        canActivate: [LoginGuard]
    },
    {
        path: 'view-receipt',
        component: ViewReceipt,
        canActivate: [LoginGuard]
    },
    {
        path: 'subscriptions',
        component: Subscriptions,
        canActivate: [LoginGuard]
    },
    {
        path: 'recipe-book',
        component: RecipeBook,
        canActivate: [LoginGuard]
    },
    {
        path: 'item',
        component: ItemPage
    },
    // Add a wildcard route for unknown URLs
    {
        path: '**',
        component: PageNotFound
    }
];
