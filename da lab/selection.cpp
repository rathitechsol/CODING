#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    int a[100];
    for(int i=0;i<n;i++) cin >> a[i];
    for(int i=0;i<n-1;i++) {
        int m=i;
        for(int j=i+1;j<n;j++)
            if(a[j]<a[m]) m=j;
        int t=a[i];
        a[i]=a[m];
        a[m]=t;
    }
    for(int i=0;i<n;i++) cout << a[i] << " ";
    return 0;
}