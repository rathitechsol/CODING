#include <iostream>
using namespace std;
void h(int a[], int n, int i) {
    int l = 2*i+1, r = 2*i+2, m = i;
    if (l < n && a[l] > a[m]) m = l;
    if (r < n && a[r] > a[m]) m = r;
    if (m != i) {
        swap(a[i], a[m]);
        h(a, n, m);
    }
}
void s(int a[], int n) {
    for (int i = n/2-1; i >= 0; i--) h(a, n, i);
    for (int i = n-1; i > 0; i--) {
        swap(a[0], a[i]);
        h(a, i, 0);
    }
}
int main() {
    int a[] = {4, 10, 3, 5, 1};
    int n = sizeof(a)/sizeof(a[0]);
    s(a, n);
    for (int i = 0; i < n; i++) cout << a[i] << " ";
    return 0;
}