#include <iostream>
using namespace std;
void sort(int a[], int n) {
    for(int i=0;i<n-1;i++) {
        int l=i+1,r=n-1,m,v=a[i];
        while(l<=r) {
            m=(l+r)/2;
            if(a[m]<v) l=m+1;
            else r=m-1;
        }
        for(int j=i;j<l-1;j++) a[j]=a[j+1];
        a[l-1]=v;
    }
}
int main() {
    int a[]={5,2,9,1,6},n=5;
    sort(a,n);
    for(int i=0;i<n;i++) cout<<a[i]<<" ";
    return 0;
}