#include <iostream>
using namespace std;

int main() {
    int n, x, f = -1;
    cin >> n;
    int* a = new int[n];
    for (int i = 0; i < n; i++) cin >> a[i];
    cin >> x;
    for (int i = 0; i < n; i++) {
        if (a[i] == x) {
            f = i;
            break;
        }
    }
    if (f != -1) cout << f;
    else cout << -1;
    delete[] a;
    return 0;
}