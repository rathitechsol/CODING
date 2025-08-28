#include <iostream>
#include <vector>
using namespace std;

void mrg(vector<int>& a, int l, int m, int r) {
    int n1 = m - l + 1, n2 = r - m;
    vector<int> x(n1), y(n2);
    for (int i = 0; i < n1; i++) x[i] = a[l + i];
    for (int i = 0; i < n2; i++) y[i] = a[m + 1 + i];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) a[k++] = (x[i] <= y[j]) ? x[i++] : y[j++];
    while (i < n1) a[k++] = x[i++];
    while (j < n2) a[k++] = y[j++];
}

void srt(vector<int>& a, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        srt(a, l, m);
        srt(a, m + 1, r);
        mrg(a, l, m, r);
    }
}

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    srt(a, 0, n - 1);
    for (int i = 0; i < n; i++) cout << a[i] << " ";
    return 0;
}