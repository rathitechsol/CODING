#include <iostream>
using namespace std;
void q(int*a,int l,int r){
    if(l>=r)return;
    int p=a[r],i=l;
    for(int j=l;j<r;j++)
        if(a[j]<p)swap(a[i++],a[j]);
    swap(a[i],a[r]);
    q(a,l,i-1);
    q(a,i+1,r);
}
int main(){
    int n;
    cin>>n;
    int*a=new int[n];
    for(int i=0;i<n;i++)cin>>a[i];
    q(a,0,n-1);
    for(int i=0;i<n;i++)cout<<a[i]<<' ';
    delete[]a;
    return 0;
}